import { Modal } from "react-native";

const CustomModal = (props) => {
    const {
        isVisible,
        isTransparent,
        animationType,
        onDismiss,
        onOrientationChange,
        onRequestClose,
        onShow,
        presentationStyle,
        statusBarTranslucent,
        children,
    } = props;

    return (
        <Modal
            visible={isVisible}
            transparent={isTransparent}
            statusBarTranslucent={statusBarTranslucent}
            presentationStyle={presentationStyle}
            animationType={animationType}
            onDismiss={onDismiss}
            onOrientationChange={onOrientationChange}
            onRequestClose={onRequestClose}
            onShow={onShow}
        >
            {children}
        </Modal>
    );
};

export default CustomModal;